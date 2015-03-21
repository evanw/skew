%%

\n[ \t\r\n]*                  NEWLINE;
[ \t\r]+                      WHITESPACE;
"//".*\n                      COMMENT;
"//".*                        COMMENT;

"as"                          AS;
"break"                       BREAK;
"continue"                    CONTINUE;
"dynamic"                     DYNAMIC;
"else"                        ELSE;
"false"                       FALSE;
"if"                          IF;
"null"                        NULL;
"return"                      RETURN;
"super"                       SUPER;
"true"                        TRUE;
"var"                         VAR;
"while"                       WHILE;

"("                           LEFT_PARENTHESIS;
")"                           RIGHT_PARENTHESIS;
"{"                           LEFT_BRACE;
"}"                           RIGHT_BRACE;
"["                           LEFT_BRACKET;
"]"                           RIGHT_BRACKET;
"=>"                          ARROW;
"~"                           TILDE;
"."                           DOT;
","                           COMMA;
"?"                           QUESTION_MARK;
":"                           COLON;
"&&"                          LOGICAL_AND;
"||"                          LOGICAL_OR;
"+"                           PLUS;
"-"                           MINUS;
"*"                           MULTIPLY;
"/"                           DIVIDE;
"%"                           REMAINDER;
"&"                           BITWISE_AND;
"|"                           BITWISE_OR;
"^"                           BITWISE_XOR;
"<<"                          SHIFT_LEFT;
">>"                          SHIFT_RIGHT;
"!="                          NOT_EQUAL;
"=="                          EQUAL;
"<="                          LESS_THAN_OR_EQUAL;
">="                          GREATER_THAN_OR_EQUAL;
"<"                           LESS_THAN;
">"                           GREATER_THAN;
"!"                           NOT;
"="                           ASSIGN;

['](\\.|[^\\'])*[']           CHARACTER;
["](\\.|[^\\"])*["]           STRING;
[A-Za-z_][A-Za-z0-9_]*        IDENTIFIER;
[0-9]+\.[0-9]+                DOUBLE;
[0-9]+                        INT;
