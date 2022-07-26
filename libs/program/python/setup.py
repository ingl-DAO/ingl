from setuptools import setup, find_packages
setup(
    name = 'ingl-cli',
    version = '0.0.1',
    packages = find_packages(),
    install_requires = [
        'asyncclick',
        'solana',
        'borsh_construct',
        'base58',
        'rich'
        ],
    entry_points = '''
    [console_scripts]
    ingl=ingl_cli:entry
    '''
)