import RedisPubSub from '/imports/startup/server/redis';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { extractCredentials } from '/imports/api/common/server/helpers';
import Logger from '/imports/startup/server/logger';
import checkAnnotation from '../helpers/checkAnnotation';

function modifyWhiteboardAnnotations(annotations, idsToRemove, whiteBoardId, action, meetingId, userId) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'ModifyWhiteboardAnnotationPubMsg';

  try {
    check(meetingId, String);
    check(userId, String);

    check(whiteBoardId, String);
    check(action, String);
    check(idsToRemove, [String]);
    check(annotations, [Match.Any]);
    annotations.forEach((annotation) => checkAnnotation(annotation));

    const payload = {
      annotations, idsToRemove, userId, whiteBoardId, action,
    };

    RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, userId, payload);
  } catch (err) {
    Logger.error(`Exception while invoking method undoAnnotation ${err.stack}`);
  }
}

export function deleteWhiteboardAnnotations(annotations, whiteboardId) {
  const { meetingId, requesterUserId } = extractCredentials(this.userId);
  modifyWhiteboardAnnotations([], annotations.map((a) => a.id), whiteboardId, 'delete', meetingId, requesterUserId);
}

export function moveWhiteboardAnnotations(annotations, whitebordId) {
  const { meetingId, requesterUserId } = extractCredentials(this.userId);
  modifyWhiteboardAnnotations(annotations, annotations.map((a) => a.id), whitebordId, 'move', meetingId, requesterUserId);
}

export default {
  deleteWhiteboardAnnotations,
  moveWhiteboardAnnotations,
};
