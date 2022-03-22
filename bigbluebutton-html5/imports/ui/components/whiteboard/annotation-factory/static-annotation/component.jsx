import React from 'react';
import PropTypes from 'prop-types';
import StaticAnnotationService from './service';

export default function StaticAnnotation(props) {
  const {
    shapeId, drawObject, slideWidth, slideHeight, whiteboardId,
  } = props;
  const annotation = StaticAnnotationService.getAnnotationById(shapeId);
  const Component = drawObject;

  const annotationSVGElement = document.getElementById(annotation.id);
  if (annotationSVGElement) annotationSVGElement.style.transform = '';

  return (
    <Component
      version={annotation.version}
      annotation={annotation.annotationInfo}
      slideWidth={slideWidth}
      slideHeight={slideHeight}
      whiteboardId={whiteboardId}
    />
  );
}

StaticAnnotation.propTypes = {
  whiteboardId: PropTypes.string.isRequired,
  shapeId: PropTypes.string.isRequired,
  drawObject: PropTypes.func.isRequired,
  slideWidth: PropTypes.number.isRequired,
  slideHeight: PropTypes.number.isRequired,
};
