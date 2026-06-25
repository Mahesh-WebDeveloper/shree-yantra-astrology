// Async controllers me try/catch baar-baar likhne se bachata hai —
// koi bhi error apne aap errorHandler tak pahunch jaata hai.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
