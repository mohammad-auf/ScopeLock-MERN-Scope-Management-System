/**
 * matchEngine.js — Re-export shim (deprecated)
 *
 * The canonical implementation has moved to:
 *   client/src/utils/scopeMatcher.js
 *
 * This file is kept only so the existing unit test
 * (matchEngine.test.js) continues to work without modification.
 * All new code should import directly from the canonical location.
 */

'use strict';

module.exports = require('../../client/src/utils/scopeMatcher');
