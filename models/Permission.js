const mongoose = require('mongoose');

const PermissionSchema = new mongoose.Schema({
  permission_name: {
    type: String,
    required: true
  },
  org_id: {
    type: String,
    ref: 'Organization',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Permission = mongoose.model('Permission', PermissionSchema);

module.exports = Permission;
