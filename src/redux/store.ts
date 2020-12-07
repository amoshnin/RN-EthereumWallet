// REDUX IMPORTS //
import { applyMiddleware, createStore, combineReducers, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';

// REDUCERS IMPORTS //
import actionSheetManager from './reducers/actionSheetManager';
import addCash from './reducers/addCash';
import appState from './reducers/appState';
import charts from './reducers/charts';
import contacts from './reducers/contacts';
import data from './reducers/data';
import editOptions from './reducers/editOptions';
import explorer from './reducers/explorer';
import fallbackExplorer from './reducers/fallbackExplorer';
import gas from './reducers/gas';
import imageMetadata from './reducers/imageMetadata';
import keyboardHeight from './reducers/keyboardHeight';
import multicall from './reducers/multicall';
import nonce from './reducers/nonce';
import openStateSettings from './reducers/openStateSettings';
import raps from './reducers/raps';
import requests from './reducers/requests';
import settings from './reducers/settings';
import showcaseTokens from './reducers/showcaseTokens';
import uniqueTokens from './reducers/uniqueTokens';
import uniswap from './reducers/uniswap';
import uniswapLiquidity from './reducers/uniswapLiquidity';
import walletconnect from './reducers/walletconnect';
import wallets from './reducers/wallets';

////////////////////////////////////////////////////////////////////////

let reducers = combineReducers({
  actionSheetManager,
  addCash,
  appState,
  charts,
  contacts,
  data,
  editOptions,
  explorer,
  fallbackExplorer,
  gas,
  imageMetadata,
  keyboardHeight,
  multicall,
  nonce,
  openStateSettings,
  raps,
  requests,
  settings,
  showcaseTokens,
  uniqueTokens,
  uniswap,
  uniswapLiquidity,
  walletconnect,
  wallets,
});

type reducersType = typeof reducers;
export type AppStateType = ReturnType<reducersType>;

type PropertiesTypes<T> = T extends { [key: string]: infer U } ? U : never;
export type InferActionsTypes<
  T extends { [key: string]: (...args: any[]) => any }
> = ReturnType<PropertiesTypes<T>>;

const store = createStore(reducers, compose(applyMiddleware(thunkMiddleware)));
export type AppState = ReturnType<typeof store.getState>;
export type AppGetState = typeof store.getState;
export type AppDispatch = typeof store.dispatch;

export default store;
