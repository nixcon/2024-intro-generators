{
  # Override nixpkgs to use the latest set of node packages
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/master";
  inputs.npmlock2nix = {
    url = "github:nix-community/npmlock2nix";
    flake = false;
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
    npmlock2nix
  }:
    flake-utils.lib.eachDefaultSystem
    (system: let
      pkgs = import nixpkgs {
        inherit system;
        overlays = [
          (self: super: {
            npmlock2nix = super.callPackage npmlock2nix { };
          })
        ];
      };
    in {
      devShells.default = pkgs.mkShell {
        nativeBuildInputs = [ pkgs.nodejs (pkgs.python3.withPackages (p: with p; [ flask flask-socketio requests ])) ];
      };
    });
}
