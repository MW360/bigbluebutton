import Moveable from 'react-moveable';
import Selecto from 'react-selecto';
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import ToolbarService from '/imports/ui/components/whiteboard/whiteboard-toolbar/service';
import SelectionModificationService from '/imports/ui/components/whiteboard/annotation-selection-modification/service';

function SelectionModification(props) {
  const moveableRef = React.useRef(null);
  const selectoRef = React.useRef(null);
  const [frameMap] = React.useState(() => new Map());

  const {
    tool,
    userIsPresenter,
    whiteboardId,
    svgDimensions,
    selection,
    isMultiUserActive,
    annotationIdsOfUser,
    slideWidth,
    slideHeight,
  } = props;

  useEffect(() => {
    if (selectoRef.current) {
      selectoRef.current.setSelectedTargets(selection);
    }
  }, [selection]);

  useEffect(() => {
    if (moveableRef.current) {
      moveableRef.current.updateRect();
    }
  }, [svgDimensions, userIsPresenter, selection]);

  // clear selection when whiteboard (current slide) changes
  useEffect(() => {
    SelectionModificationService.selectAnnotations([]);
  }, [whiteboardId]);

  function getPointerCoordinatesByEvent(event, eventTypes) {
    let x = null;
    let y = null;

    if (!eventTypes || eventTypes.includes(event.type)) {
      const isTouchEvent = Object.prototype.hasOwnProperty.call(event, 'touches');
      if (isTouchEvent) {
        x = event.touches[0].pageX;
        y = event.touches[0].pageY;
      } else {
        x = event.clientX;
        y = event.clientY;
      }
    }
    return { x, y };
  }

  function hitTest(e) {
    const { x, y } = getPointerCoordinatesByEvent(e);
    const selectableElements = Array.from(document.querySelectorAll('.selectable, div.moveable-area'));

    return selectableElements.filter((el) => {
      const rect = el.getBoundingClientRect();
      return x >= rect.left && x <= rect.right
          && y >= rect.top && y <= rect.bottom;
    });
  }

  function forwardEventOnSelectableToSelectoOrMoveable(eventToTarget) {
    if (selectoRef) {
      const { x, y } = getPointerCoordinatesByEvent(eventToTarget, ['mousedown', 'touchstart']);
      if (!x || !y) return;

      const elements = document.elementsFromPoint(x, y)
        .filter((e) => e.classList.contains('selectable'));

      const hitElements = hitTest(eventToTarget);

      if (elements.length > 0) {
        const { continueSelect } = selectoRef.current.selecto.options;
        if (continueSelect || !hitElements.some((element) => element.matches('div.moveable-area'))) {
          selectoRef.current.clickTarget(eventToTarget, elements[0]);
        }
      }

      if (hitElements.length) {
        moveableRef.current.dragStart(eventToTarget);
      }
    }
  }

  function deleteAnnotations(event) {
    const { target, key } = event;

    const targetIsInputArea = ['TEXTAREA', 'INPUT'].includes(target.nodeName);
    const keyIsDeleteKey = ['Delete', 'Backspace'].includes(key);

    if (!targetIsInputArea && keyIsDeleteKey) {
      ToolbarService.deleteAnnotations(whiteboardId);
    }
  }

  // Workaround to inject mousedown events into Selecto and Moveable.
  // Otherwise, events get consumed by whiteboard / presentation overlay.
  useEffect(() => {
    const events = ['mousedown', 'touchstart'];
    events.forEach(
      (eventType) => window.addEventListener(eventType,
        forwardEventOnSelectableToSelectoOrMoveable),
    );
    return () => {
      events.forEach(
        (eventType) => window.removeEventListener(eventType,
          forwardEventOnSelectableToSelectoOrMoveable),
      );
    };
  }, []);

  useEffect(() => {
    window.addEventListener('keyup', deleteAnnotations);
    return () => {
      window.removeEventListener('keyup', deleteAnnotations);
    };
  }, []);

  function initializeFrame(dragEvent, customTarget) {
    const target = customTarget || dragEvent.target;
    frameMap.set(target, { translate: [0, 0] });
    const frame = frameMap.get(target);
    dragEvent.set(frame.translate);
  }

  function updateFrame(dragEvent) {
    const { target } = dragEvent;
    const frame = frameMap.get(target);
    frame.translate = dragEvent.beforeTranslate;
    target.style.transform = `translate(${frame.translate[0]}px, ${frame.translate[1]}px)`;
  }

  return (
    <>
      {userIsPresenter || isMultiUserActive ? (
        <Moveable
          origin={false}
          draggable
          snappable
          // pass pointer events on drag area
          // this allows keeping presentation / whiteboard overlay active
          // when mouse is over selection group
          snapContainer={document.body}
          bounds={
            document.querySelector('#slide')?.getBoundingClientRect()
          }
          passDragArea={false}
          rootContainer={document.body}
          onDragStart={(e) => {
            const { target } = e;
            initializeFrame(e, target);
          }}
          onDrag={(e) => {
            updateFrame(e);
          }}
          onDragEnd={(e) => {
            const { target } = e;
            const frame = frameMap.get(target);

            const annotation = SelectionModificationService.getAnnotatonObjectById(target.id)[0];

            const [
              xStart, yStart, xEnd, yEnd,
            ] = annotation.annotationInfo.points;

            frame.translate = e.lastEvent.beforeDist;

            const updatedStart = {
              x: xStart + ((frame.translate[0] / slideWidth) * 100),
              y: yStart + ((frame.translate[1] / slideHeight) * 100),
            };

            const updatedEnd = {
              x: xEnd + ((frame.translate[0] / slideWidth) * 100),
              y: yEnd + ((frame.translate[1] / slideHeight) * 100),
            };

            annotation.annotationInfo.points = [
              updatedStart.x, updatedStart.y, updatedEnd.x, updatedEnd.y,
            ];

            ToolbarService.moveAnnotations(whiteboardId, [annotation]);
          }}
          onDragGroupStart={(e) => e.events.forEach((dragEvent) => initializeFrame(dragEvent))}
          onDragGroup={(e) => e.events.forEach((dragEvent) => updateFrame(dragEvent))}
          edge={false}
          ref={moveableRef}
          target={selection}
        />
      ) : null}
      <Selecto
        // disable selecto on other tools and if user is presenter
        dragCondition={({ inputEvent }) => tool === 'selection'
            && (userIsPresenter || isMultiUserActive)
            // disable Selecto on fullscreen button to preserve selection
            && ![inputEvent.target.tagName, inputEvent.target.parentNode?.tagName].includes('BUTTON')}
        boundContainer="#slideSVG"
        ref={selectoRef}
        selectByClick
        toggleContinueSelect="shift"
        selectableTargets={['.selectable']}
        onSelect={
          (e) => {
            SelectionModificationService.selectAnnotations(e.selected
              .filter((target) => annotationIdsOfUser.includes(target.id)));
          }
        }
        onDragStart={(e) => {
          const elementsWithPointerInBoundingBox = hitTest(e).filter((el) => selection.includes(el) || el.matches('div.moveable-area'));

          if (elementsWithPointerInBoundingBox.length) {
            e.stop();
          }
        }}
        onSelectEnd={(e) => {
          SelectionModificationService.selectAnnotations(e.selected
            .filter((target) => annotationIdsOfUser.includes(target.id)));
        }}
      />
    </>
  );
}

SelectionModification.propTypes = {
  tool: PropTypes.string.isRequired,
  // Track local position to trigger rerender of
  // selection rectangle (Moveable control box) on zoom.
  // Zoom itself does not work as trigger prop because
  // sometimes it gets updated prior to re-rendering.
  svgDimensions: PropTypes.objectOf(PropTypes.number).isRequired,
  userIsPresenter: PropTypes.bool.isRequired,
  whiteboardId: PropTypes.string.isRequired,
  selection: PropTypes.arrayOf(PropTypes.object).isRequired,
  isMultiUserActive: PropTypes.bool.isRequired,
  // all annotations on current whiteboard that belong to the user
  annotationIdsOfUser: PropTypes.arrayOf(PropTypes.string).isRequired,
  slideWidth: PropTypes.number.isRequired,
  slideHeight: PropTypes.number.isRequired,
};

export default SelectionModification;
