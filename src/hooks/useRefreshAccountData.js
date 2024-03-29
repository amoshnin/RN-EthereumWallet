import { captureException } from '@sentry/react-native';
import delay from 'delay';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import NetworkTypes from '../helpers/networkTypes';
import { explorerInit } from '~/redux/reducers/explorer';
import { uniqueTokensRefreshState } from '~/redux/reducers/uniqueTokens';
import { uniswapUpdateLiquidityState } from '~/redux/reducers/uniswapLiquidity';
import { fetchWalletNames } from '~/redux/reducers/wallets';
import useAccountSettings from './useAccountSettings';
import useSavingsAccount from './useSavingsAccount';
import logger from '~/utils/logger';

export default function useRefreshAccountData() {
  const dispatch = useDispatch();
  const { network } = useAccountSettings();
  const { refetchSavings } = useSavingsAccount();

  const refreshAccountData = useCallback(async () => {
    // Refresh unique tokens for Rinkeby
    if (network === NetworkTypes.rinkeby) {
      const getUniqueTokens = dispatch(uniqueTokensRefreshState());
      return Promise.all([delay(1250), getUniqueTokens]);
    }

    // Nothing to refresh for other testnets
    if (network !== NetworkTypes.mainnet) {
      return Promise.all([delay(1250)]);
    }

    try {
      const getWalletNames = dispatch(fetchWalletNames());
      const getUniswapLiquidity = dispatch(uniswapUpdateLiquidityState());
      const getUniqueTokens = dispatch(uniqueTokensRefreshState());
      const explorer = dispatch(explorerInit());

      return Promise.all([
        delay(1250), // minimum duration we want the "Pull to Refresh" animation to last
        getWalletNames,
        getUniswapLiquidity,
        getUniqueTokens,
        refetchSavings(true),
        explorer,
      ]);
    } catch (error) {
      logger.log('Error refreshing data', error);
      captureException(error);
      throw error;
    }
  }, [dispatch, network, refetchSavings]);

  return refreshAccountData;
}
