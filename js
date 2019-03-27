#! /bin/sh
set -eu

PKGS=${PKGS:-$*}
ARGS=${ARGS:-}
WITH_NIX_PATH=${WITH_NIX_PATH:-}

export NIXPKGS_ALLOW_BROKEN=1
export NIXPKGS_ALLOW_UNFREE=1

if [ "$WITH_NIX_PATH" != "" ]; then
	echo "Using given NIX_PATH: $WITH_NIX_PATH"
	export NIX_PATH="$WITH_NIX_PATH"
elif [ "$(uname -s)" = "Darwin" ]; then
    export NIX_PATH="nixpkgs=channel:nixpkgs-19.03-darwin"
    echo "Using darwin NIX_PATH: $NIX_PATH"
else
	export NIX_PATH="nixpkgs=channel:nixos-19.03"
	echo "Using standard NIX_PATH: $NIX_PATH"
fi








devtoolsQualified="pkgs.haskellPackages.cabal-install"
devtools="cabal-install"

case $PKGS in
	*.cabal)
		nix-shell -p cabal2nix --run "cabal2nix --compiler ghcjs --shell $(dirname $PKGS) --extra-arguments $(echo $devtools | sed 's/[ ]/ --extra-arguments /g') > /tmp/hs.nix"
		nix-shell -p bash --run "sed -i 's/executableHaskellDepends/buildDepends = with pkgs; [$devtoolsQualified];\nexecutableHaskellDepends/' /tmp/hs.nix"
        if [[ ! $(grep 'buildDepends' /tmp/hs.nix) ]]; then
            nix-shell -p bash --run "sed -i 's/libraryHaskellDepends/buildDepends = with pkgs; [$devtoolsQualified];\nlibraryHaskellDepends/' /tmp/hs.nix"
        fi;
		nix-shell -p pkgconfig -p ctags --run "nix-shell $ARGS --argstr compiler ghcjs /tmp/hs.nix"
		;;
	*)
		nix-shell $ARGS -p pkgconfig -p ctags -p "haskell.packages.ghcjs.ghcWithPackages (p: with p; [$devtools $PKGS ])"
		;;
esac
