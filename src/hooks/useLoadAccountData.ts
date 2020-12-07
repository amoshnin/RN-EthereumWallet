import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import networkTypes from '../helpers/networkTypes';
import { loadStateThunkCreator } from '~/redux/reducers/addCash';
import { dataLoadState } from '~/redux/reducers/data';
import { coinListLoadState } from '~/redux/reducers/editOptions';
import { openStateSettingsLoadState } from '~/redux/reducers/openStateSettings';
import { requestsLoadState } from '~/redux/reducers/requests';
import { showcaseTokensLoadState } from '~/redux/reducers/showcaseTokens';
import { uniqueTokensLoadState } from '~/redux/reducers/uniqueTokens';
import { uniswapLoadState } from '~/redux/reducers/uniswap';
import { uniswapLiquidityLoadState } from '~/redux/reducers/uniswapLiquidity';
import { walletConnectLoadState } from '~/redux/reducers/walletconnect';
import { promiseUtils } from '../utils';
import logger from '~/utils/logger';

export default function useLoadAccountData() {
  const dispatch = useDispatch();

  const loadAccountData = useCallback(
    async network => {
      logger.sentry('Load wallet account data');
      await dispatch(openStateSettingsLoadState());
      await dispatch(coinListLoadState());
      await dispatch(showcaseTokensLoadState());
      const promises = [];
      if (network === networkTypes.mainnet) {
        const p1 = dispatch(dataLoadState());
        const p2 = dispatch(uniqueTokensLoadState());
        promises.push(p1, p2);
      }
      const p3 = dispatch(requestsLoadState());
      const p4 = dispatch(walletConnectLoadState());
      const p5 = dispatch(uniswapLoadState());
      const p6 = dispatch(loadStateThunkCreator());
      const p7 = dispatch(uniswapLiquidityLoadState());
      promises.push(p3, p4, p5, p6, p7);

      return promiseUtils.PromiseAllWithFails(promises);
    },
    [dispatch]
  );

  return loadAccountData;
}
