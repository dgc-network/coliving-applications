jest.mock('services/ColivingBackend', () => ({
  fetchCID: jest.fn().mockImplementation((cid) => cid),
  recordAgreementListen: jest.fn(),
  getSelectableContentNodes: jest.fn(),
  submitAndEvaluateAttestations: jest.fn()
}))
