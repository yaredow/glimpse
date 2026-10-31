{ pkgs, ... }:

{
  languages.javascript = {
    enable = true;
    bun.enable = true;
  };

  packages = with pkgs; [
    android-tools
  ];

  enterShell = ''
    export ANDROID_HOME="$HOME/Android/Sdk"
    export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
    echo "✨ Glimpse App (React Native) Environment Ready"
    echo "Bun: $(bun --version)"
  '';
}

