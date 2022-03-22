const shapeTypes = ['rectangle', 'triangle', 'ellipse', 'line'];

export function getTypeDefinition(type) {
  const resolvedType = shapeTypes.includes(type) ? 'shape' : type;

  return !['shape', 'pencil', 'text'].includes(resolvedType) ? {} : {
    id: String,
    status: String,
    annotationType: String,
    annotationInfo: {
      ...(resolvedType === 'text') && {
        x: Number,
        y: Number,
        fontColor: Number,
        calcedFontSize: Number,
        textBoxWidth: Number,
        text: String,
        textBoxHeight: Number,
        fontSize: Number,
        dataPoints: String,
      },
      ...(resolvedType === 'shape') && { fill: Boolean },
      id: String,
      whiteboardId: String,
      status: String,
      type: String,
      ...(['pencil', 'shape'].includes(resolvedType)) && {
        dimensions: Match.Maybe([Number]),
        color: Number,
        thickness: Number,
        points: Array,
      },
    },
    wbId: String,
    userId: String,
    position: Number,
  };
}

export function getQueryFromType(type) {
  const resolvedType = shapeTypes.includes(type) ? 'shape' : type;
  return !['shape', 'pencil', 'text'].includes(resolvedType) ? {} : {
    id: 1,
    status: 1,
    annotationType: 1,
    ...Object.fromEntries(Object.entries({
      ...(resolvedType === 'text') && {
        x: 1,
        y: 1,
        fontColor: 1,
        calcedFontSize: 1,
        textBoxWidth: 1,
        text: 1,
        textBoxHeight: 1,
        fontSize: 1,
        dataPoints: 1,
      },
      ...(resolvedType === 'shape') && { fill: 1},
      id: 1,
      whiteboardId: 1,
      status: 1,
      type: 1,
      ...(['pencil', 'shape'].includes(resolvedType)) && {
        dimensions: 1,
        color: 1,
        thickness: 1,
        points: 1,
      },
    }).map(([key, value]) => [`annotationInfo.${key}`, value])),
    wbId: 1,
    userId: 1,
    position: 1,
  };
}

export default {
  getTypeDefinition,
  getQueryFromType,
};
