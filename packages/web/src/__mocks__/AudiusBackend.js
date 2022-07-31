jest.mock('services/ColivingBackend', () => ({
  fetchCID: jest.fn().mockImplementation((cid) => cid),
  recordTrackListen: jest.fn(),
  getSelectableCreatorNodes: jest.fn(),
  submitAndEvaluateAttestations: jest.fn()
}))
