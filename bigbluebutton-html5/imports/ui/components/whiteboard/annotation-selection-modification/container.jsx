import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import SelectionModification from '/imports/ui/components/whiteboard/annotation-selection-modification/component';
import SelectionModificationService from '/imports/ui/components/whiteboard/annotation-selection-modification/service';
import WhiteboardToolbarService from '/imports/ui/components/whiteboard/whiteboard-toolbar/service';
import PropTypes from 'prop-types';
import { Annotations, isMultiUserActive } from '/imports/ui/components/whiteboard/service';
import WhiteboardOverlayService from '/imports/ui/components/whiteboard/whiteboard-overlay/service';

const SelectionModificationContainer = (props) => (<SelectionModification {...props} />);

export default withTracker(({ whiteboardId }) => {
  const selection = SelectionModificationService.getSelectedAnnotations();
  const drawSettings = WhiteboardToolbarService.getCurrentDrawSettings();

  const userId = WhiteboardOverlayService.getCurrentUserId();
  const annotationIdsOfUser = Annotations.find(
    {
      whiteboardId,
      userId,
    },
    {
      fields: { id: 1 },
    },
  ).fetch().map((annotation) => annotation.id);

  return {
    tool: drawSettings ? drawSettings.whiteboardAnnotationTool : '',
    selection,
    isMultiUserActive: isMultiUserActive(whiteboardId),
    annotationIdsOfUser,
  };
})(SelectionModificationContainer);

SelectionModificationContainer.propTypes = {
  svgDimensions: PropTypes.objectOf(PropTypes.number).isRequired,
  userIsPresenter: PropTypes.bool.isRequired,
  whiteboardId: PropTypes.string.isRequired,
};
