from fabric.api import *

env.hosts = ['mccutchen@overloaded.org']

def deploy():
    run('cd mccutch.org && git pull --rebase')
