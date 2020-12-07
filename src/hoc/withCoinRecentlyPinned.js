import { connect } from 'react-redux';
import {
  pushSelectedCoin,
  removeSelectedCoin,
} from '~/redux/reducers/editOptions';

const mapStateToProps = ({ editOptions: { recentlyPinnedCount } }) => ({
  recentlyPinnedCount,
});

export default Component =>
  connect(mapStateToProps, {
    pushSelectedCoin,
    removeSelectedCoin,
  })(Component);
