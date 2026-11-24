from authx import AuthX, AuthXConfig

config = AuthXConfig()
config.JWT_SECRET_KEY = "MEGA_ULTRA_SECRET_MEGA_KEY_14888_%@%@52"
config.JWT_ACCESS_COOKIE_NAME = "SIGMA_TOKEN"
config.JWT_TOKEN_LOCATION = ['cookies']
config.JWT_COOKIE_CSRF_PROTECT = False  # <-- добавь это (для учебного проекта ок)

security = AuthX(config=config)
