const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
    org_id: {
        type: String,
        ref: 'Organization'
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});

const Announcement = mongoose.model('Announcement', AnnouncementSchema);
module.exports = Announcement;