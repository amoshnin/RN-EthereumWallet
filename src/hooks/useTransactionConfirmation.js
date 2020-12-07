import { useSelector } from 'react-redux';
import { dataAddNewTransaction } from '~/redux/reducers/data';
import { updateTransactionCountNonce } from '~/redux/reducers/nonce';
import { removeRequest } from '~/redux/reducers/requests';
import { walletConnectSendStatus } from '~/redux/reducers/walletconnect';

export default function useTransactionConfirmation() {
  const { transactionCountNonce } = useSelector(
    ({ nonce: { transactionCountNonce } }) => ({
      transactionCountNonce,
    })
  );
  return {
    dataAddNewTransaction,
    removeRequest,
    transactionCountNonce,
    updateTransactionCountNonce,
    walletConnectSendStatus,
  };
}
