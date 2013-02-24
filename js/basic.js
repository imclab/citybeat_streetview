/*
 * SimpleModal Basic Modal Dialog
 * http://www.ericmmartin.com/projects/simplemodal/
 * http://code.google.com/p/simplemodal/
 *
 * Copyright (c) 2010 Eric Martin - http://ericmmartin.com
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Revision: $Id: basic.js 254 2010-07-23 05:14:44Z emartin24 $
 */

jQuery(function ($) {

  // Load dialog on click
  $('#about').click(function (e) {
    $('#about-modal-text').show();
    $('#privacy-modal-text').hide();
    $('#basic-modal-content').modal();
  
    return false;
  });

  $('#privacy').click(function (e) {
    $('#about-modal-text').hide();
    $('#privacy-modal-text').show();
    $('#basic-modal-content').modal();
    return false;
  });
});
