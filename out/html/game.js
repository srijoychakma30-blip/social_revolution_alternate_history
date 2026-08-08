(function() {
  var game;
  var ui;

  var DateOptions = {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  var main = function(dendryUI) {
    ui = dendryUI;
    game = ui.game;

    // Add your custom code here.
  };

  var TITLE = "Brazil on the Brink: A History of the PCdoB" + '_' + "Your Name";

  // Pass a URL to a game.json mod file to load it.
  window.loadMod = function(url) {
    ui.loadGame(url);
  };

  // Toggle the stats library sidebar panel.
  window.showStats = function() {
    if (window.dendryUI.dendryEngine.state.sceneId.startsWith('library')) {
      window.dendryUI.dendryEngine.goToScene('backSpecialScene');
    } else {
      window.dendryUI.dendryEngine.goToScene('library');
    }
  };

  // Toggle the mod loader panel.
  window.showMods = function() {
    window.hideOptions();
    if (window.dendryUI.dendryEngine.state.sceneId.startsWith('mod_loader')) {
      window.dendryUI.dendryEngine.goToScene('backSpecialScene');
    } else {
      window.dendryUI.dendryEngine.goToScene('mod_loader');
    }
  };

  // Update the now-playing display with the current audio track name.
  window.updateAudio = function(song) {
    var now_playing = document.getElementById('currently_playing');
    if (song) {
      var parts = song.split('/');
      now_playing.textContent = parts[parts.length - 1];
    } else {
      var s = window.dendryUI.currentAudioURL;
      var parts = s.split('/');
      now_playing.textContent = parts[parts.length - 1];
    }
  };

  // Set the audio volume (0–100 input, normalized to 0–1).
  window.setVolume = function(volume) {
    window.dendryUI.volume = volume / 100;
    window.dendryUI.currentAudio.volume = volume / 100;
  };

  // Skip to the next track by jumping the current time past the end.
  window.shuffle = function() {
    window.dendryUI.currentAudio.currentTime = 9999;
  };

  // Show the options overlay and attach a click-outside-to-close handler.
  window.showOptions = function() {
    var el = document.getElementById('options');
    window.populateOptions();
    el.style.display = 'block';
    if (!el.onclick) {
      el.onclick = function(evt) {
        if (evt.target == el) {
          window.hideOptions();
        }
      };
    }
  };

  // Hide the options overlay.
  window.hideOptions = function() {
    document.getElementById('options').style.display = 'none';
  };

  // Background image toggles.
  window.disableBg = function() {
    window.dendryUI.disable_bg = true;
    document.body.style.backgroundImage = 'none';
    window.dendryUI.saveSettings();
  };

  window.enableBg = function() {
    window.dendryUI.disable_bg = false;
    window.dendryUI.setBg(window.dendryUI.dendryEngine.state.bg);
    window.dendryUI.saveSettings();
  };

  // Text animation toggles.
  window.disableAnimate = function() {
    window.dendryUI.animate = false;
    window.dendryUI.saveSettings();
  };

  window.enableAnimate = function() {
    window.dendryUI.animate = true;
    window.dendryUI.saveSettings();
  };

  // Background animation toggles.
  window.disableAnimateBg = function() {
    window.dendryUI.animate_bg = false;
    window.dendryUI.saveSettings();
  };

  window.enableAnimateBg = function() {
    window.dendryUI.animate_bg = true;
    window.dendryUI.saveSettings();
  };

  // Audio toggles.
  window.disableAudio = function() {
    window.dendryUI.toggle_audio(false);
    window.dendryUI.saveSettings();
  };

  window.enableAudio = function() {
    window.dendryUI.toggle_audio(true);
    window.dendryUI.saveSettings();
  };

  // Portrait/image toggles.
  window.enableImages = function() {
    window.dendryUI.show_portraits = true;
    window.dendryUI.saveSettings();
  };

  window.disableImages = function() {
    window.dendryUI.show_portraits = false;
    window.dendryUI.saveSettings();
  };

  // Light/dark mode toggles.
  window.enableLightMode = function() {
    window.dendryUI.dark_mode = false;
    document.body.classList.remove('dark-mode');
    window.dendryUI.saveSettings();
  };

  window.enableDarkMode = function() {
    window.dendryUI.dark_mode = true;
    document.body.classList.add('dark-mode');
    window.dendryUI.saveSettings();
  };

  // Populate all option checkboxes/radio buttons from current settings.
  window.populateOptions = function() {
    var disable_bg    = window.dendryUI.disable_bg;
    var animate       = window.dendryUI.animate;
    var disable_audio = window.dendryUI.disable_audio;
    var show_portraits = window.dendryUI.show_portraits;

    if (disable_bg) {
      $('#backgrounds_no')[0].checked = true;
    } else {
      $('#backgrounds_yes')[0].checked = true;
    }

    if (animate) {
      $('#animate_yes')[0].checked = true;
    } else {
      $('#animate_no')[0].checked = true;
    }

    if (disable_audio) {
      $('#audio_no')[0].checked = true;
    } else {
      $('#audio_yes')[0].checked = true;
    }

    if (show_portraits) {
      $('#images_yes')[0].checked = true;
    } else {
      $('#images_no')[0].checked = true;
    }

    if (window.dendryUI.dark_mode) {
      $('#dark_mode')[0].checked = true;
    } else {
      $('#light_mode')[0].checked = true;
    }
  };

  // Hook to modify displayed text before rendering. Return the text unchanged
  // by default; override here to wrap messages in spans, apply filters, etc.
  window.displayText = function(text) {
    return text;
  };

  // Hook called when the engine emits a signal event.
  window.handleSignal = function(signal, event, scene_id) {
  };

  // Called on every new page. Auto-saves unless we just loaded a save.
  window.onNewPage = function() {
    var scene = window.dendryUI.dendryEngine.state.sceneId;
    if (scene !== 'root' && !window.justLoaded) {
      window.dendryUI.autosave();
    }
    if (window.justLoaded) {
      window.justLoaded = false;
    }
  };

  // Re-render the sidebar stats panel by running the current tab's scene.
  window.updateSidebar = function() {
    $('#qualities').empty();
    var scene = dendryUI.game.scenes[window.statusTab];
    dendryUI.dendryEngine._runActions(scene.onArrival);
    var displayContent = dendryUI.dendryEngine._makeDisplayContent(scene.content, true);
    $('#qualities').append(dendryUI.contentToHTML.convert(displayContent));
  };

  // Switch the active sidebar tab. Blocks the poll tab in historical mode.
  window.changeTab = function(newTab, tabId) {
    if (tabId === 'poll_tab' && dendryUI.dendryEngine.state.qualities.historical_mode) {
      window.alert('Polls are not available in historical mode.');
      return;
    }
    var tabButton = document.getElementById(tabId);
    var tabButtons = document.getElementsByClassName('tab_button');
    for (var i = 0; i < tabButtons.length; i++) {
      tabButtons[i].className = tabButtons[i].className.replace(' active', '');
    }
    tabButton.className += ' active';
    window.statusTab = newTab;
    window.updateSidebar();
  };

  // Re-render the sidebar whenever new content is displayed.
  window.onDisplayContent = function() {
    window.updateSidebar();
  };

  /*
   * Render a horizontal progress bar for a numeric quality.
   *
   * quality      - the current numeric value
   * qualityName  - label string to display on the bar
   * max, min     - the range boundaries
   * colors       - if truthy, color the bar green→yellow→red by value
   */
  window.generateBar = function(quality, qualityName, max, min, colors) {
    var bar = document.createElement('div');
    bar.className = 'bar';

    var value = document.createElement('div');
    value.className = 'barValue';

    var width = (quality - min) / (max - min);
    if (width > 1) { width = 1; }
    if (width < 0) { width = 0; }

    value.style.width = Math.round(width * 100) + '%';

    if (colors) {
      value.style.backgroundColor = window.probToColor(width * 100);
    }

    bar.textContent = qualityName + ': ' + quality;
    if (colors) {
      bar.textContent += '/' + max;
    }

    bar.appendChild(value);
    return bar;
  };

  // Font size controls — step by 0.1em, apply to content and sidebar together.
  window.increaseFontSize = function() {
    window.dendryUI.font_size += 0.1;
    var fs = window.dendryUI.font_size;
    var sidebar_fs = fs - 0.1;
    document.getElementById('content').setAttribute('style', 'font-size: ' + fs + 'em;');
    document.getElementById('stats_sidebar').setAttribute('style', 'font-size: ' + sidebar_fs + 'em;');
    window.dendryUI.saveSettings();
  };

  window.decreaseFontSize = function() {
    window.dendryUI.font_size -= 0.1;
    var fs = window.dendryUI.font_size;
    var sidebar_fs = fs - 0.1;
    document.getElementById('content').setAttribute('style', 'font-size: ' + fs + 'em;');
    document.getElementById('stats_sidebar').setAttribute('style', 'font-size: ' + sidebar_fs + 'em;');
    window.dendryUI.saveSettings();
  };

  // Initialise on page load: restore saved settings, apply dark mode and
  // font size if non-default, and set the pinned cards description string.
  window.onload = function() {
    window.dendryUI.loadSettings({ show_portraits: false });

    if (window.dendryUI.dark_mode) {
      document.body.classList.add('dark-mode');
    }

    if (window.dendryUI.font_size !== 1.1) {
      var fs = window.dendryUI.font_size;
      var sidebar_fs = fs - 0.1;
      document.getElementById('content').setAttribute('style', 'font-size: ' + fs + 'em;');
      document.getElementById('stats_sidebar').setAttribute('style', 'font-size: ' + sidebar_fs + 'em;');
    }

    window.pinnedCardsDescription = "Advisor cards — actions are only usable once per 6 months.";
  };

  // Bootstrap: flag the initial load so onNewPage skips the first autosave,
  // set the default sidebar tab, and hand our main function to Dendry.
  window.justLoaded = true;
  window.statusTab = 'status';
  window.dendryModifyUI = main;
  console.log("Modifying stats: see dendryUI.dendryEngine.state.qualities");

}());