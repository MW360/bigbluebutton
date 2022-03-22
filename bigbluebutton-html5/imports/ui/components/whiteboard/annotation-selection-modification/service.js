import { Tracker } from 'meteor/tracker';
import { Annotations } from '../service';
import { getQueryFromType } from '/imports/api/annotations/annotationTypeDefinition';

let selectedAnnotations = [];
const selectionDep = new Tracker.Dependency();

const selectAnnotations = (annotations) => {
  selectedAnnotations = annotations;
  selectionDep.changed();
};

const getSelectedAnnotations = () => {
  selectionDep.depend();
  return selectedAnnotations;
};

const getAnnotatonObjectById = (annotationId) => {
  const selector = { id: annotationId };
  return Annotations.find(selector, {
    fields: { ...getQueryFromType('shape'), _id: 0 },
  }).fetch();
};

const deselect = (annotationsToDeselect) => {
  selectedAnnotations = selectedAnnotations
    .filter((annotation) => !(annotationsToDeselect.constructor === Array
      ? annotationsToDeselect.includes(annotation.id)
      : annotationsToDeselect === annotation.id));
  selectionDep.changed();
};

export default {
  deselect,
  getSelectedAnnotations,
  getAnnotatonObjectById,
  selectAnnotations,
};
