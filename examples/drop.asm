# 0-49 is the display, for now
# 49-99 is the framebuffer
# 100 is frame counter
# 101 is whether we need to draw a new one yet

LDA 0
STA $101 # Make sure the grid is working
LDA 100
STA $49
STA $48
STA $47
STA $46
STA $45
LDB 1
JSR DRAW_LINE

GAME_LOOP:
  JSR MOVE_DOWN
  JSR MOVE_FRAMEBUFFER
  LDA 100
  STA $49
  STA $48
  STA $47
  STA $46
  STA $45
  LDA $100
  ADD 1
  STA $100
  LDA $101
  BEQ A,GAME_LOOP
  LDA 0
  STA $101
  LDB 1
  JSR DRAW_LINE
  JMP GAME_LOOP

MOVE_DOWN:
  LDA 0
  LDB 0
  LDY 0
MOVE_LOOP:
  TBA
  LDB $0,A
  BEQ B,SKIP
  ADD 5
  LDX $0,A
  SUB 5
  BEQ X,EMPTY
  ADD 50
  STB A
  SUB 50
  LDB 1
  STB $101
  JMP SKIP
EMPTY:
  ADD 55
  STB A
  SUB 55
  STY A
SKIP:
  ADD 1
  TAB
  SUB 45
  BNE A,MOVE_LOOP
  RTS

MOVE_FRAMEBUFFER:
  LDA 45
  LDX 0
FB_MOVE_LOOP:
  LDB $49,A
  ADD 49
  STX A
  SUB 49
  SUB 1
  STB A
  BNE A,FB_MOVE_LOOP

# Load color into B before calling
DRAW_LINE:
  STB $0
  STB $1
  STB $2
  STB $3
  RTS
