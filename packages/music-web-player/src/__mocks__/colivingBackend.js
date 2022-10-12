jest.mock('services/colivingBackend', () => ({
  fetchCID: jest.fn().mockImplementation((cid) => cid),
  recordDigitalContentListen: jest.fn(),
  getSelectableContentNodes: jest.fn(),
  submitAndEvaluateAttestations: jest.fn()
}))
