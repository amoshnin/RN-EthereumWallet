import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addCashClearState } from '~/redux/reducers/addCash';
import { dataResetState } from '~/redux/reducers/data';
import { explorerClearState } from '~/redux/reducers/explorer';
import { nonceClearState } from '~/redux/reducers/nonce';
import { resetOpenStateSettings } from '~/redux/reducers/openStateSettings';
import { requestsResetState } from '~/redux/reducers/requests';
import { uniqueTokensResetState } from '~/redux/reducers/uniqueTokens';
import { uniswapResetState } from '~/redux/reducers/uniswap';
import { uniswapLiquidityResetState } from '~/redux/reducers/uniswapLiquidity';
import { promiseUtils } from '../utils';

export default function useResetAccountState() {
  const dispatch = useDispatch();

  const resetAccountState = useCallback(async () => {
    const p0 = dispatch(explorerClearState());
    const p1 = dispatch(dataResetState());
    const p2 = dispatch(uniqueTokensResetState());
    const p3 = dispatch(resetOpenStateSettings());
    const p4 = dispatch(nonceClearState());
    const p5 = dispatch(requestsResetState());
    const p6 = dispatch(uniswapResetState());
    const p7 = dispatch(uniswapLiquidityResetState());
    const p8 = dispatch(addCashClearState());
    await promiseUtils.PromiseAllWithFails([
      p0,
      p1,
      p2,
      p3,
      p4,
      p5,
      p6,
      p7,
      p8,
    ]);
  }, [dispatch]);

  return resetAccountState;
}
