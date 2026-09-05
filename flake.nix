{
  description = "oseille — PWA prix fruits & légumes France";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            pnpm
            typescript
            nil
            nixpkgs-fmt
            playwright-test
          ];
          shellHook = ''
            echo "oseille devShell — node $(node --version) pnpm $(pnpm --version)"
            [ -d node_modules ] || npm install
          '';
        };

        packages.default = pkgs.buildNpmPackage {
          pname = "oseille";
          version = "0.1.0";
          src = ./.;
          npmDepsHash = "sha256-yHDRvrnGiVkD952RyX2Sc02OQsT4znrJYtWlF5+ux7Q=";
          installPhase = ''
            mkdir -p $out
            cp -r dist/* $out/ 2>/dev/null || echo "no dist — run pnpm build first"
          '';
        };

        checks = {
          lint = pkgs.buildNpmPackage {
            pname = "oseille-lint";
            version = "0.1.0";
            src = ./.;
            npmDepsHash = "sha256-yHDRvrnGiVkD952RyX2Sc02OQsT4znrJYtWlF5+ux7Q=";
            dontNpmBuild = true;
            buildPhase = "npm run lint";
            installPhase = "mkdir -p $out";
          };
          build = pkgs.buildNpmPackage {
            pname = "oseille-build";
            version = "0.1.0";
            src = ./.;
            npmDepsHash = "sha256-yHDRvrnGiVkD952RyX2Sc02OQsT4znrJYtWlF5+ux7Q=";
            dontNpmBuild = true;
            buildPhase = "npm run build";
            installPhase = "mkdir -p $out && cp -r dist/* $out/ 2>/dev/null || true";
          };
        };
      });
}
