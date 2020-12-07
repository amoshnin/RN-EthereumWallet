import { connect } from 'react-redux';
import { removeRequest } from '~/redux/reducers/requests';

const mapStateToProps = ({ walletconnect: { walletConnectors } }) => ({
  walletConnectors,
});

export default Component =>
  connect(mapStateToProps, { removeRequest })(Component);
