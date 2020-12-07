import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setOpenFamilyTabs } from '~/redux/reducers/openStateSettings';
import {
  addShowcaseToken as rawAddShowcaseToken,
  removeShowcaseToken as rawRemoveShowcaseToken,
} from '~/redux/reducers/showcaseTokens';

export default function useShowcaseTokens() {
  const dispatch = useDispatch();
  const showcaseTokens = useSelector(
    state => state.showcaseTokens.showcaseTokens
  );

  const addShowcaseToken = useCallback(
    asset => {
      dispatch(rawAddShowcaseToken(asset));
      dispatch(setOpenFamilyTabs({ index: 'Showcase', state: true }));
    },
    [dispatch]
  );

  const removeShowcaseToken = useCallback(
    asset => dispatch(rawRemoveShowcaseToken(asset)),
    [dispatch]
  );

  return {
    addShowcaseToken,
    removeShowcaseToken,
    showcaseTokens,
  };
}
