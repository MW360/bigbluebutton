import { check } from 'meteor/check';
import { getTypeDefinition } from '/imports/api/annotations/annotationTypeDefinition';

export default function checkAnnotation(annotation) {
  check(annotation, Match.ObjectIncluding({ annotationType: String }));
  check(annotation, getTypeDefinition(annotation.annotationType));
}
