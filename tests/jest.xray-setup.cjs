jest.mock("aws-xray-sdk-core", () => {
  const actual = jest.requireActual("aws-xray-sdk-core");
  const XRay = actual.default ?? actual;
  const dummySubsegment = () => ({
    addAnnotation() {},
    addMetadata() {},
    addError() {},
    close() {},
  });
  return {
    __esModule: true,
    default: {
      ...XRay,
      captureAsyncFunc: (_name, fcn) => fcn(dummySubsegment()),
    },
  };
});
