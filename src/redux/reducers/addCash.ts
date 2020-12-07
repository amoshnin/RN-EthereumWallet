//    *GENERAL IMPORTS*   //
import { ThunkAction } from 'redux-thunk';
import { AppStateType, InferActionsTypes } from '../store';

import analytics from '@segment/analytics-react-native';
import { captureException, captureMessage } from '@sentry/react-native';
import { find, map, toLower } from 'lodash';
import {
  getPurchaseTransactions,
  savePurchaseTransactions,
} from '../../handlers/localstorage/accountLocal';
import { trackWyreOrder, trackWyreTransfer } from '../../handlers/wyre';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import TransactionTypes from '../../helpers/transactionTypes';
import { WYRE_ORDER_STATUS_TYPES } from '../../helpers/wyreStatusTypes';
import { AddCashCurrencies, AddCashCurrencyInfo } from '../../references';
import { ethereumUtils } from '../../utils';
import maybeReviewAlert from '../../utils/reviewAlert';

import logger from '~/utils/logger';
import { dataAddNewTransaction } from './data';

////////////////////////////////////////////////////////////////////////

const initialState = {
  currentOrderStatus: null as string | null,
  currentTransferId: null as string | null,
  error: {},
  purchaseTransactions: [],
};

type initialStateType = typeof initialState;

// *REDUCER* //
const addCash = (
  state = initialState,
  action: ActionTypes
): initialStateType => {
  if (action.type === 'RESET_ORDER') {
    return {
      ...state,
      currentOrderStatus: null,
      currentTransferId: null,
      error: {},
    };
  }

  if (action.type === 'ORDER_CREATION_FAILURE') {
    return {
      ...state,
      currentOrderStatus: WYRE_ORDER_STATUS_TYPES.failed,
      error: action.error,
    };
  }

  if (action.type === 'ORDER_FAILURE') {
    return {
      ...state,
      error: action.error,
    };
  }

  if (action.type === 'UPDATE_PURCHASE_TRANSACTIONS') {
    return {
      ...state,
      purchaseTransactions: action.transactions,
    };
  }

  if (action.type === 'UPDATE_ORDER_STATUS') {
    return {
      ...state,
      currentOrderStatus: action.status,
    };
  }

  if (action.type === 'UPDATE_TRANSFER_ID') {
    return {
      ...state,
      currentTransferId: action.transferId,
    };
  }

  if (action.type === 'CLEAR_STATE') {
    return {
      ...state,
      ...initialState,
    };
  }
  return state;
};

export default addCash;

///////////////////////////////////////////////////////////////////////

type ActionTypes = InferActionsTypes<typeof ActionCreatorsList>;

//    *ACTION CREATORS*   //
export const ActionCreatorsList = {
  resetCurrentOrderActionCreator: () =>
    ({
      type: 'RESET_ORDER',
    } as const),

  setOrderCreationFailuteActionCreator: (error: any) =>
    ({
      type: 'ORDER_CREATION_FAILURE',
      error,
    } as const),

  setOrderFailuteActionCreator: (error: any) =>
    ({
      type: 'ORDER_FAILURE',
      error,
    } as const),

  updatePurchaseTransactionsActionCreator: (transactions: any) =>
    ({
      type: 'UPDATE_PURCHASE_TRANSACTIONS',
      transactions,
    } as const),

  updateCurrentOrderStatusActionCreator: (status: any) =>
    ({
      type: 'UPDATE_ORDER_STATUS',
      status,
    } as const),

  updateCurrentTransferIdActionCreator: (transferId: string) =>
    ({
      type: 'UPDATE_TRANSFER_ID',
      transferId,
    } as const),

  clearStateActionCreator: () =>
    ({
      type: 'CLEAR_STATE',
    } as const),
};

//    *THUNKS*   //
type ThunkType = ThunkAction<Promise<any>, AppStateType, unknown, ActionTypes>;
let orderStatusHandle: any = null;
let transferHashHandle: any = null;

const MAX_TRIES = 10 * 60;
const MAX_ERROR_TRIES = 3;

export const loadStateThunkCreator = (): ThunkType => {
  return async (dispatch, getState) => {
    const { accountAddress, network } = getState().settings;
    try {
      const purchases = await getPurchaseTransactions(accountAddress, network);

      dispatch(
        ActionCreatorsList.updatePurchaseTransactionsActionCreator(purchases)
      );
      // eslint-disable-next-line no-empty
    } catch (error) {}
  };
};

export const clearStateThunkCreator = (): ThunkType => {
  return async (dispatch, getState) => {
    orderStatusHandle && clearTimeout(orderStatusHandle);
    transferHashHandle && clearTimeout(transferHashHandle);
    dispatch(ActionCreatorsList.clearStateActionCreator());
  };
};

export const updatePurchasesThunkCreator = (purchases: any): ThunkType => {
  return async (dispatch, getState) => {
    const { purchaseTransactions } = getState().addCash;
    const { accountAddress, network } = getState().settings;

    const updatedPurchases = map(purchaseTransactions, (txn: any) => {
      if (txn.status === TransactionStatusTypes.purchasing) {
        const updatedPurchase = find(
          purchases,
          purchase =>
            ethereumUtils.getHash(purchase) === ethereumUtils.getHash(txn)
        );
        if (updatedPurchase) {
          return {
            ...txn,
            ...updatedPurchase,
          };
        }
        return txn;
      }
      return txn;
    });

    dispatch(
      ActionCreatorsList.updatePurchaseTransactionsActionCreator(
        updatedPurchases
      )
    );
    savePurchaseTransactions(updatedPurchases, accountAddress, network);
  };
};

export const getOrderStatusThunkCreator = (
  referenceInfo: any,
  destCurrency: any,
  orderId: any,
  paymentResponse: any,
  sourceAmount: any
): ThunkType => {
  return async (dispatch, getState) => {
    const { accountAddress, network } = getState().settings;
    const getOrderStatus = async (
      referenceInfo: any,
      destCurrency: any,
      orderId: any,
      paymentResponse: any,
      sourceAmount: any,
      remainingTries = MAX_TRIES,
      remainingErrorTries = MAX_ERROR_TRIES
    ) => {
      try {
        if (remainingTries === 0) return;
        const { data, orderStatus, transferId } = await trackWyreOrder(
          referenceInfo,
          orderId,
          network
        );

        const { accountAddress: currentAccountAddress } = getState().settings;
        if (currentAccountAddress !== accountAddress) return;

        dispatch(
          ActionCreatorsList.updateCurrentOrderStatusActionCreator(orderStatus)
        );

        const isFailed = orderStatus === WYRE_ORDER_STATUS_TYPES.failed;

        if (isFailed) {
          const { errorCategory, errorCode, errorMessage } = data;

          dispatch(
            ActionCreatorsList.setOrderFailuteActionCreator({
              errorCategory,
              errorCode,
              errorMessage,
            })
          );
          logger.sentry('Wyre order data failed', data);
          captureMessage(
            `Wyre final check - order status failed - ${referenceInfo.referenceId}`
          );
          analytics.track('Purchase failed', {
            category: 'add cash',
            error_category: errorCategory,
            error_code: errorCode,
            error_message: errorMessage,
          });
        }

        if (transferId) {
          dispatch(
            ActionCreatorsList.updateCurrentTransferIdActionCreator(transferId)
          );

          referenceInfo.transferId = transferId;
          dispatch(
            cashGetTransferHashThunkCreator(
              referenceInfo,
              transferId,
              sourceAmount
            )
          );
          analytics.track('Purchase completed', {
            category: 'add cash',
          });
          maybeReviewAlert();
        } else if (!isFailed) {
          orderStatusHandle = setTimeout(
            () =>
              getOrderStatus(
                referenceInfo,
                destCurrency,
                orderId,
                paymentResponse,
                sourceAmount,
                remainingTries - 1,
                remainingErrorTries
              ),
            1000
          );
        }
      } catch (error) {
        captureException(error);
        if (remainingErrorTries === 0) return;
        orderStatusHandle = setTimeout(
          () =>
            getOrderStatus(
              referenceInfo,
              destCurrency,
              orderId,
              paymentResponse,
              sourceAmount,
              remainingTries,
              remainingErrorTries - 1
            ),
          5000
        );
      }
    };

    await getOrderStatus(
      referenceInfo,
      destCurrency,
      orderId,
      paymentResponse,
      sourceAmount
    );
  };
};

const cashGetTransferHashThunkCreator = (
  referenceInfo: any,
  transferId: any,
  sourceAmount: any
) => async (dispatch: any, getState: any) => {
  logger.log('[add cash] - watch for transfer hash');
  const { accountAddress, network } = getState().settings;
  const { assets } = getState().dataReducer;
  const getTransferHash = async (
    referenceInfo: any,
    transferId: any,
    sourceAmount: any,
    remainingTries = MAX_TRIES,
    remainingErrorTries = MAX_ERROR_TRIES
  ) => {
    try {
      if (remainingTries === 0) return;
      const {
        destAmount,
        destCurrency,
        transferHash,
      } = await trackWyreTransfer(referenceInfo, transferId, network);

      const { accountAddress: currentAccountAddress } = getState().settings;
      if (currentAccountAddress !== accountAddress) return;

      const destAssetAddress = toLower(
        AddCashCurrencies[network][destCurrency]
      );

      if (transferHash) {
        logger.log('[add cash] - Wyre transfer hash', transferHash);
        let asset = ethereumUtils.getAsset(assets, destAssetAddress);
        if (!asset) {
          asset = AddCashCurrencyInfo[network][destAssetAddress];
        }
        const txDetails = {
          amount: destAmount,
          asset,
          from: null,
          hash: transferHash,
          nonce: null,
          sourceAmount,
          status: TransactionStatusTypes.purchasing,
          timestamp: Date.now(),
          to: accountAddress,
          transferId,
          type: TransactionTypes.purchase,
        };
        logger.log('[add cash] - add new pending txn');
        const newTxDetails = await dispatch(
          dataAddNewTransaction(txDetails),
          false
        );
        dispatch(newPurchaseTransactionThunkCreator(newTxDetails));
      } else {
        transferHashHandle = setTimeout(
          () =>
            getTransferHash(
              referenceInfo,
              transferId,
              sourceAmount,
              remainingTries - 1,
              remainingErrorTries
            ),
          1000
        );
      }
    } catch (error) {
      if (remainingErrorTries === 0) return;
      transferHashHandle = setTimeout(
        () =>
          getTransferHash(
            referenceInfo,
            transferId,
            sourceAmount,
            remainingTries,
            remainingErrorTries - 1
          ),
        5000
      );
    }
  };
  await getTransferHash(referenceInfo, transferId, sourceAmount);
};

export const newPurchaseTransactionThunkCreator = (
  txDetails: any
): ThunkType => {
  return async (dispatch, getState) => {
    const { purchaseTransactions } = getState().addCash;
    const { accountAddress, network } = getState().settings;
    const updatedPurchases = [txDetails, ...purchaseTransactions];
    dispatch(
      ActionCreatorsList.updatePurchaseTransactionsActionCreator(
        updatedPurchases
      )
    );
    savePurchaseTransactions(updatedPurchases, accountAddress, network);
  };
};
