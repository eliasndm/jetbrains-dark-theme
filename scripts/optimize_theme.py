from __future__ import annotations
import os
import re
import json
from enum import Enum, auto
from argparse import ArgumentParser
from collections import Counter
from operator import attrgetter


NAME_KEY = "name"
SCOPE_KEY = "scope"
SETTINGS_KEY = "settings"
FOREGROUND_KEY = "foreground"
FONTSTYLE_KEY = "fontStyle"


#region Scope
class Scope:
    def __init__(self, scope: str) -> None:
        self.scope = scope

    def __str__(self) -> str:
        return self.scope
    
    def __len__(self) -> int:
        return len(self._to_list())
    
    def __eq__(self, other) -> bool:
        if isinstance(other, Scope):
            if self.scope == other.scope:
                return True
        return False
    
    def __ne__(self, other) -> bool:
        return not self.__eq__(other)
    
    def __lt__(self, other) -> bool:
        if isinstance(other, Scope):
            if len(self) < len(other):
                return True
        return False
    
    def __gt__(self, other) -> bool:
        if isinstance(other, Scope):
            if len(self) > len(other):
                return True
        return False
    
    def __ge__(self, other) -> bool:
        if isinstance(other, Scope):
            if self._compare(other) and self > other:
                return True
        return False
    
    def __le__(self, other) -> bool:
        if isinstance(other, Scope):
            if self._compare(other) and self < other:
                return True
        return False

    def _compare(self, other) -> bool:
        depth = min(len(self), len(other))
        t = False
        for i in range(0, depth):
            if self._to_list()[i] == other._to_list()[i]:
                t = True
            else:
                return False
        return t

    def _to_list(self) -> list[str]:
        slist = self.scope.split(".")
        return slist

#endregion

#region Settings
class Settings:
    def __init__(self, foreground: str, fontstyle: str) -> None:
        self.foreground = foreground
        self.fontstyle = fontstyle

    def __eq__(self, other) -> bool:
        if isinstance(other, Settings):
           if self.foreground == other.foreground and self.fontstyle == other.fontstyle:
               return True
        return False
    
    def __str__(self):
        return json.dumps(self.to_dict())
    
    def to_dict(self) -> dict:
        d = {}
        if self.foreground is not None:
            d.update({FOREGROUND_KEY: self.foreground})
        if self.fontstyle is not None:
            d.update({FONTSTYLE_KEY: self.fontstyle})
        return d
    
    @classmethod
    def from_dict(cls, s_dict: dict):
        foreground = s_dict.get(FOREGROUND_KEY)
        fontstyle = s_dict.get(FONTSTYLE_KEY)
        return Settings(foreground, fontstyle)


class ColorRule:
    def __init__(self, name: str, scope: list[Scope], settings: Settings) -> None:
        self.name = name
        self.scope = scope
        self.settings = settings
        self.category = None
        self._parse_category(name)

    def to_dict(self) -> dict:
        if len(self.scope) == 1:
            scope = str(self.scope[0])
        else: 
            scope = [str(s) for s in self.scope]
        d = {}
        if self.name is not None:
            d.update({NAME_KEY: self.name})
        
        d.update({
            SCOPE_KEY: scope,
            SETTINGS_KEY: self.settings.to_dict()
            })
        return d

    def _parse_category(self, name) -> str | None:
        if name is None:
            return None
        cat = re.match(r"\[(.*)\]", name)
        if cat:
            self.category = cat.group(1)
            
#endregion

#region Theme
class VSCodeTheme:
    def __init__(self):
        self.name: str = None
        self.colors = None
        self.include = None
        self.token_colors: list[ColorRule] = None
        self.semantic_highlighting: bool = None
        self.semantic_token_colors = None

    @classmethod
    def from_dict(cls, theme_dict: dict):
        theme = cls()
        theme.name = theme_dict.get("name")
        theme.colors = theme_dict.get("colors")
        theme.include = theme_dict.get("include")
        theme.semantic_highlighting = theme_dict.get("semanticHighlighting")
        theme.semantic_token_colors = theme_dict.get("semanticTokenColors")
        theme.token_colors = theme._parse_tokencolors(theme_dict.get("tokenColors"))
        return theme

    def to_dict(self) -> dict:
        d = {"$schema": "vscode://schemas/color-theme"}
        if self.name != None:
            d.update({"name": self.name})
        if self.include != None:
            d.update({"include": self.include})
        if self.colors != None:
            d.update({"colors": self.colors})
        if self.token_colors is not None:
            token_color_rules = [x.to_dict() for x in self.token_colors]
            d.update({"tokenColors": token_color_rules})
        if self.semantic_highlighting is not None:
            d.update({"semanticHighlighting": self.semantic_highlighting})
        if self.semantic_token_colors is not None:
            d.update({"semanticTokenColors": self.semantic_token_colors})
        return d
    
    def _parse_scopes(self, scopes: list[str]) -> list[Scope]:
        if isinstance(scopes, str):
            return [Scope(scopes)]
        else:
            return [Scope(s) for s in scopes]

    def _parse_settings(self, settings: dict) -> Settings:
        foreground = settings.get(FOREGROUND_KEY)
        fontstyle = settings.get(FONTSTYLE_KEY)
        return Settings(foreground, fontstyle)

    def _parse_tokencolors(self, color_rules: list[dict]) -> list[ColorRule]:
        for i, rule in enumerate(color_rules):
            name = rule.get(NAME_KEY)
            scopes = rule.get(SCOPE_KEY)
            if scopes is not None:
                scopes = self._parse_scopes(scopes)
            settings = rule.get(SETTINGS_KEY)
            if settings is not None:
                settings = self._parse_settings(settings)
            color_rules[i] = ColorRule(name, scopes, settings)
        return color_rules
    
#endregion


#region Json Decode

class States(Enum):
    NORMAL = auto()
    STRING = auto()
    COMMENT = auto()


class JsonCleaner():
    def __init__(self):
        self.state = States.NORMAL
        self.idx = 0
        self.last_comma_idx = None
        self.last_char = None
        self.curr_char = None
        self.comma_trailing = False
        self.comment_begin_idx = None
    
    def clean_jsonc(self, jsonc: str) -> str:
        json_out = []
        while self.idx < len(jsonc):
            _char = jsonc[self.idx]
            # Handle comments
            if (_char == "/" and self._peek(jsonc) == "/"
                and self.state != States.STRING):
                self.state = States.COMMENT
                self.comment_begin_idx = self.idx
                self.idx += 1
                continue
            elif _char == "\n" and self.state == States.COMMENT:
                self.state = States.NORMAL
                
            elif self.state == States.COMMENT:
                self.idx += 1
                continue
            
            match _char:
                case '"' if self.state == States.NORMAL:
                    self.state = States.STRING
                    json_out.append(_char)
                case '"' if self.state != States.COMMENT:
                    self.state = States.NORMAL
                    self.comma_trailing = False
                    json_out.append(_char)
                case "}" | "]" if self.comma_trailing == True:
                    json_out.pop(self.last_comma_idx)
                    json_out.append(_char)
                    self.comma_trailing = False
                case "," if self.state == States.NORMAL:
                    json_out.append(_char)
                    self.last_comma_idx = len(json_out) - 1
                    self.comma_trailing = True
                case "/" if self.state == States.STRING:
                    # Escape character
                    json_out.append("\\")
                    json_out.append(_char)
                case _ if self.state != States.COMMENT:
                    json_out.append(_char)
            self.idx += 1
        return "".join(json_out)

    def _peek(self, jsonc: str) -> str:
        return jsonc[self.idx+1] if self.idx + 1 < len(jsonc) else None
    
#endregion


#region Functions

def dedupe_scopes(theme: VSCodeTheme) -> None:
    """Removes duplicate scopes which appear in rules with
    similar settings.
    """
    all_scopes = []
    # Find duplicate scopes
    for didx, rule in enumerate(theme.token_colors):
        for k, _scope in enumerate(rule.scope):
            d = {"ridx": didx,
                "sidx": k,
                SCOPE_KEY: str(_scope),
                SETTINGS_KEY: rule.settings.to_dict()
                }
            all_scopes.append(d)
    _scopes = [{SCOPE_KEY: x.get(SCOPE_KEY), SETTINGS_KEY: x.get(SETTINGS_KEY)}
                for x in all_scopes]
    _json_scopes = [json.dumps(x, sort_keys=True) for x in _scopes]
    counts = Counter(_json_scopes)
    
    # Get indices of scopes that appear more than once
    dupes_idxs = [i for i, x in enumerate(counts.items()) if x[1] > 1] 
    for i, didx in enumerate(dupes_idxs):
        rule_idx = all_scopes[didx].get("ridx")
        scope_idx = all_scopes[didx].get("sidx")
        theme.token_colors[rule_idx].scope.pop(scope_idx)
        # if args.verbose:
        #     print(f"Duplicate scope {scope_idx} in rule {rule_idx + 1} removed.")
        for _didx in dupes_idxs[i + 1:]:
            # Adjust scope idx of other duplicates if the scope is
            # in the same rule as previous one and scope idx is
            # larger than previous scope index
            if rule_idx == all_scopes[_didx]["ridx"]:
                if scope_idx < all_scopes[_didx]["sidx"]:
                    all_scopes[_didx]["sidx"] -= 1
    remove_empty_scope_rules(theme)
     

def combine_rules(theme: VSCodeTheme) -> None:
    """Combines all rules with matching settings into
    one token color rule.
    """
    settings_dict = {}
    for rule in theme.token_colors:
        setting_key = str(rule.settings)
        scopes_list = rule.scope
        if settings_dict.get(setting_key) is not None:
            settings_dict[setting_key].extend(scopes_list)
        else:
            settings_dict.update({setting_key: scopes_list})

    merged_rules = []
    for setting, scopes_list in settings_dict.items():
        setting = Settings.from_dict(json.loads(setting))
        rule = ColorRule(None, scopes_list, setting)
        merged_rules.append(rule)
    theme.token_colors = merged_rules


def remove_empty_scope_rules(theme: VSCodeTheme) -> None:
    """Removes all rules with empty scope lists from
    the theme.
    """
    valid_rules = [r for r in theme.token_colors
                      if len(r.scope) > 0]
    theme.token_colors = valid_rules


def sort_scope_lists(theme: VSCodeTheme) -> None:
    for rule in theme.token_colors:
        scope = rule.scope
        if not isinstance(scope, str):
            scope.sort(key=attrgetter("scope"))


def filter_rules(theme: VSCodeTheme, filter_str: str) -> None:
    _match = re.match(r"(-|\+)?\[(.*)\]", filter_str)
    if _match:
        try:
            op = _match.group(1)
            categories = _match.group(2)
            categories = categories.split(",")
            categories = [c.lstrip(" ").rstrip(" ") for c in categories]
            match op:
                case "-":
                    token_colors = [r for r in theme.token_colors
                                    if r.category not in categories
                                    and r.category is not None]
                    theme.token_colors = token_colors
                case "+":
                    token_colors = [r for r in theme.token_colors
                                    if r.category in categories
                                    or r.category is None]
                    theme.token_colors = token_colors
                case None:
                    pass
        except Exception as e:
            print(e)
            pass


def load_theme(filename: str) -> dict:
    """Loads the theme json file and strips trailing comma and
    comments.
    """
    with open(filename, mode="r", encoding="utf-8") as themefile:
        theme_json_str = themefile.read()
        clean_json_str = JsonCleaner().clean_jsonc(theme_json_str)
        theme_dict = json.loads(clean_json_str)
        return theme_dict
#endregion


def main(filename: str, outfile: str = None, combine: bool = False,
         dedupe: bool = False, minify: bool = False, sort: bool = False,
         remove_names: bool = False, verbose: bool = False, indent: int = 2, _filter: str = None):
    if outfile is None:
        outfile = re.sub(r"\.json", "", filename) + "_opti.json" 
    
    print("* Reading theme")
    original_file_size = os.path.getsize(filename)
    theme_dict = load_theme(filename)
    print("* Processing theme")
    theme = VSCodeTheme.from_dict(theme_dict)

    if _filter is not None:
        filter_rules(theme, _filter)
    if combine:
        combine_rules(theme)
        print("  - Combined rules")
    elif remove_names:
        pass
    if dedupe:
        dedupe_scopes(theme)
        print("  - Removed Duplicates")
    
    if sort:
        sort_scope_lists(theme)
        print("  - Sorted scopes")

    sep = (", ", ": ")
    if minify:
        indent = None
        sep = (",", ":")
        print("    Minified JSON")

    outtheme_json = json.dumps(theme.to_dict(), indent=indent, separators=sep)
    with open(outfile, mode="w+", encoding="utf-8") as file:
        file.write(outtheme_json)
        print(f"* Written theme {outfile}")

    original_file_size = original_file_size / 1000
    output_file_size = os.path.getsize(outfile) / 1000
    
    # Summary
    print("* Theme filesize")
    print(f"  > Before: {original_file_size:>8.2f} KB")
    print(f"  > After:  {output_file_size:>8.2f} KB")


if __name__ == "__main__":
    parser = ArgumentParser()

    parser.add_argument("filename")
    parser.add_argument("-o", "--output", help="output filename")
    parser.add_argument("-c", "--combine", action="store_true",
                        help="Combines all rules with matching settings")
    parser.add_argument("-d", "--dedupe", action="store_true",
                        help="Removes duplicate scopes")
    parser.add_argument("-m", "--minify", action="store_true",
                        help="Outputs the themes json in the most compact form.")
    parser.add_argument("-n", "--names", action="store_true",
                        help="Remove rule names")
    parser.add_argument("-s", "--sort", action="store_true", help="Sort scope lists")
    parser.add_argument("-i", "--indent", type=int, default=2)
    parser.add_argument("-v", "--verbose", action="store_true")
    parser.add_argument("-f", "--filter", type=str)

    args = parser.parse_args()
            
    main(args.filename, outfile=args.output, combine=args.combine,
         dedupe=args.dedupe, minify=args.minify, sort=args.sort, remove_names=args.names,
         verbose=args.verbose, indent=args.indent, _filter=args.filter)
