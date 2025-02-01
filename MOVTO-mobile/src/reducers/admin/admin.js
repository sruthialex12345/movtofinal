import * as types from "../../actionTypes";

const initialState = {
  currentMessage: {}
};

export default function admin(state = initialState, action = {}) {
  switch (action.type) {
    case types.ADMIN_SEND_MESSAGE:
      return {
        ...state,
        currentMessage: action.message
      };
    default:
      return state;
  }
}
