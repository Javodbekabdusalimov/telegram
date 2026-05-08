import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    activePanel: 'chats',
    showSidebar: true,
    showRightPanel: false,
    rightPanelType: null,
    modals: {
      newChat: false,
      newGroup: false,
      newChannel: false,
      createPost: false,
      settings: false,
      contacts: false,
      profile: false,
      editProfile: false,
    },
    theme: localStorage.getItem('kayfqil_theme') || 'dark',
    callState: null,
    incomingCall: null,
  },
  reducers: {
    setActivePanel: (state, action) => { state.activePanel = action.payload; },
    toggleSidebar: (state) => { state.showSidebar = !state.showSidebar; },
    openModal: (state, action) => {
      const { modal, data } = action.payload;
      state.modals[modal] = data || true;
    },
    closeModal: (state, action) => {
      state.modals[action.payload] = false;
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach((key) => { state.modals[key] = false; });
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('kayfqil_theme', action.payload);
    },
    setCallState: (state, action) => { state.callState = action.payload; },
    setIncomingCall: (state, action) => { state.incomingCall = action.payload; },
    showRightPanel: (state, action) => {
      state.showRightPanel = true;
      state.rightPanelType = action.payload;
    },
    hideRightPanel: (state) => {
      state.showRightPanel = false;
      state.rightPanelType = null;
    },
  },
});

export const {
  setActivePanel, toggleSidebar, openModal, closeModal, closeAllModals,
  setTheme, setCallState, setIncomingCall, showRightPanel, hideRightPanel,
} = uiSlice.actions;
export default uiSlice.reducer;
