START:
  TXA
  JSR STORE
  JMP START
STORE:
  STA A
  JSR ADDING
  RTS
ADDING:
  ADD 1
  JSR TRANSFER
  RTS
TRANSFER:
  TAX
  JSR SUBTRACTING
  RTS
SUBTRACTING:
  SUB 200
  JSR BRANCHING
  RTS
BRANCHING:
  BEQ A,END
  RTS

END:
  HLT
