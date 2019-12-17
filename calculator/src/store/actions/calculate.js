import * as types from '../types';

export const setValues = (expression, total) => {
  return {
    type: types.SET_VALUES,
    expression,
    total
  }
}

export const calculate = key => {
  return {
    type: types.SET_EXPRESSION,
    payload: key
  }
}

export const clear = () => {
  return {
    type: types.CLEAR_EXPRESSION
  }
}

export const deleteLastEntry = () => {
  return {
    type: types.DELETE_LAST_EXPRESSION_ENTRY
  }
}

export const evaluateExpression = () => {
  return {
    type: types.EVALUATE_EXPRESSION
  }
}