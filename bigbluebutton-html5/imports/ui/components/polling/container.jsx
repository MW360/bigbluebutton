import React from 'react';
import PropTypes from 'prop-types';
import { withTracker } from 'meteor/react-meteor-data';
import Users from '/imports/ui/local-collections/users-collection/users';
import Auth from '/imports/ui/services/auth';
import PollingService from './service';
import PollService from '/imports/ui/components/poll/service';
import PollingComponent from './component';

const propTypes = {
  pollExists: PropTypes.bool.isRequired,
};

const POLLING_ENABLED = Meteor.settings.public.poll.enabled;

const PollingContainer = ({ pollExists, ...props }) => {
  const currentUser = Users.findOne({ userId: Auth.userID }, { fields: { presenter: 1 } });
  const showPolling = pollExists && !currentUser.presenter && POLLING_ENABLED;

  if (showPolling) {
    return (
      <PollingComponent {...props} />
    );
  }
  return null;
};

PollingContainer.propTypes = propTypes;

export default withTracker(() => {
  const {
    pollExists, handleVote, poll, handleTypedVote,
  } = PollingService.mapPolls();
  return ({
    pollExists,
    handleVote,
    handleTypedVote,
    poll,
    pollAnswerIds: PollService.pollAnswerIds,
    pollTypes: PollService.pollTypes,
    isDefaultPoll: PollService.isDefaultPoll,
    isMeteorConnected: Meteor.status().connected,
  });
})(PollingContainer);
