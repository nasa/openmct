
function CompositionModelPolicy() {
}

CompositionModelPolicy.prototype.allow = function (candidate) {
    var candidateType = candidate.getCapability('type');

    return Array.isArray(
        (candidateType.getInitialModel() || {}).composition
    );
};

export default CompositionModelPolicy;
