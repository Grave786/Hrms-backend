const mongoose = require('mongoose');

const EffortSchema = new mongoose.Schema({
    effort: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Effort', EffortSchema);
