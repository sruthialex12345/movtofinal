import * as types from "../../actionTypes";
import Immutable from "seamless-immutable";

const initialState = Immutable({
  root: "login", // 'login' / 'after-login',
  navigator: null,
  socket: null
});

export default function app(state = initialState, action = {}) {
  switch (action.type) {
    case types.ROOT_CHANGED:
      return {
        ...state,

        root: action.root
      };
    case types.SET_SOCKET:
      return {
        ...state,
        socket: action.payload
      };
    case types.SET_NAVIGATOR:
      return {
        ...state,
        navigator: action.payload
      };
    case types.RESET_APP:
      return {
        ...initialState
      };
    default:
      return state;
  }
}
