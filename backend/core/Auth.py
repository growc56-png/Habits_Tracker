from authx import AuthXConfig,AuthX




config=AuthXConfig()
config.JWT_ACCESS_COOKIE_NAME="acces_cooke"
config.JWT_SECRET_KEY="I_LOVE_WORK_AND_I_ALSO_MEGA_GENIUS_GIVE_ME_MONEUY_PLS_I_NEED_2MLM|N"
config.JWT_TOKEN_LOCATION=['cookies']
security=AuthX(config=config)