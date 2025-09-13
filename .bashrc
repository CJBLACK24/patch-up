# --- EXACT prompt like the screenshot ---
# green arrow, bold white folder, grey "git:", red (branch)

parse_git_branch() {
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || return
  local br
  br=$(git symbolic-ref --quiet --short HEAD 2>/dev/null || git rev-parse --short HEAD 2>/dev/null)
  # prints:  <space>git:(branch) with colors
  printf ' \[\e[90m\]git:\[\e[31m\](%s)\[\e[0m\]' "$br"
}

# Prompt: ➜ <folder> git:(branch)
PS1='\[\e[32m\]➜\[\e[0m\] \[\e[1;37m\]\W\[\e[0m\]$(parse_git_branch) '

# Optional: load .bashrc from .bash_profile shells
if [ -f ~/.bashrc ]; then
  : # noop to avoid “incorrect setup” warning when sourced via .bash_profile
fi
if [ -f ~/.bashrc ]; then
  . ~/.bashrc
fi
