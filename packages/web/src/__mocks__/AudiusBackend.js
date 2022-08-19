jest.mock('services/ColivingBackend', () => ({
  fetchCID: jest.fn().mockImplementation((cid) => cid),
  recordAgreementListen: jest.fn(),
  getSelectableCreatorNodes: jest.fn(),
  submitAndEvaluateAttestations: jest.fn()
}))
