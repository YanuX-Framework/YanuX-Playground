import React from 'react';
import { operators } from '../../utils/constants'
export default ({ onButtonClick, buttonKey, disabled }) => {
  let handleClick = (e) => { onButtonClick(e.target.textContent) }
  let classNames = [
    'btn',
    operators.includes(buttonKey) ? 'btn-operator' : '',
    buttonKey === '0' ? 'btn-zero' : '',
    buttonKey === 'Del' ? 'btn-delete' : '',
    buttonKey === 'C' ? 'btn-clear' : ''
  ];
  return (
    <button
      name={buttonKey}
      className={classNames.join(' ').trim()}
      onClick={handleClick}
      disabled={disabled}>
      {buttonKey}
    </button>
  );
}