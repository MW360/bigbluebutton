import Moveable from 'react-moveable';
import Selecto from 'react-selecto';
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import SelectionService from '/imports/ui/components/whiteboard/annotation-selection-modification/service';
import { setDeselectHandle } from '/imports/ui/components/whiteboard/service';
import ToolbarService from '/imports/ui/components/whiteboard/whiteboard-toolbar/service';

function SelectionModification(props) {
  const moveableRef = React.useRef(null);
  const selectoRef = React.useRef(null);
  const [moveableTargets, setMoveableTargets] = React.useState([]);

  const {
    tool, userIsPresenter, whiteboardId, localPosition, zoom,
  } = props;

  useEffect(() => {
    if (moveableRef.current) {
      moveableRef.current.updateRect();
    }
  }, [localPosition, userIsPresenter, zoom]);

  function deselect(selection) {
    setMoveableTargets(moveableTargets.filter((selected) => !selection.includes(selected.id)));
  }

  function forwardEventOnSelectableToSelecto(eventToTarget) {
    if (selectoRef) {
      const newEvent = eventToTarget;

      let x = null;
      let y = null;

      switch (eventToTarget.type) {
        case 'mousedown':
          x = eventToTarget.clientX;
          y = eventToTarget.clientY;
          break;
        case 'touchstart':
          x = eventToTarget.touches[0].pageX;
          y = eventToTarget.touches[0].pageY;
          break;
        default:
          break;
      }

      if (!x || !y) return;

      const elements = document.elementsFromPoint(x, y)
        .filter((e) => e.classList.contains('selectable'));
      if (elements.length > 0) {
        [newEvent.target] = elements;
        // selectoRef.current.clickTarget(newEvent, elements[0]);
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

  useEffect(() => {
    setDeselectHandle(deselect);
  });

  // Workaround to inject mousedown events into Selecto.
  // Otherwise, events get consumed by whiteboard / presentation overlay.
  useEffect(() => {
    const events = ['mousedown', 'touchstart'];
    events.forEach(
      (eventType) => window.addEventListener(eventType, forwardEventOnSelectableToSelecto),
    );
    return () => {
      events.forEach(
        (eventType) => window.removeEventListener(eventType, forwardEventOnSelectableToSelecto),
      );
    };
  });

  useEffect(() => {
    window.addEventListener('keyup', deleteAnnotations);
    return () => {
      window.removeEventListener('keyup', deleteAnnotations);
    };
  });

  return (
    <>
      {userIsPresenter ? (
        <Moveable
          origin={false}
          draggable={false}
          // pass pointer events on drag area temporarily until moving is implemented
          // this allows keeping presentation / whiteboard overlay active when mouse is over selection group
          passDragArea
          rootContainer={document.body}
          edge={false}
          ref={moveableRef}
          target={moveableTargets}
        />
      ) : null}
      <Selecto
        // disable selecto on other tools and if user is presenter
        dragCondition={() => tool === 'selection' && userIsPresenter}
        container={'#slideSVG'}
        boundContainer="#slideSVG"
        ref={selectoRef}
        selectByClick
        toggleContinueSelect="shift"
        selectableTargets={['.selectable']}
        onSelect={
          (e) => {
            setMoveableTargets(e.selected);
          }
        }
        onSelectEnd={(e) => {
          setMoveableTargets(e.selected);
          SelectionService.selectAnnotations(e.selected.map((target) => target.id));
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
  // sometimes it gets updated prior to rerendering.
  localPosition: PropTypes.objectOf(PropTypes.number).isRequired,
  zoom: PropTypes.number.isRequired,
  userIsPresenter: PropTypes.bool.isRequired,
  whiteboardId: PropTypes.string.isRequired,
};

export default SelectionModification;
