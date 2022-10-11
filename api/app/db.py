from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Log(db.Model):
    __tablename__ = 'logs'
    doi = db.Column(db.String(64), primary_key=True)
    userId = db.Column(db.String(64), primary_key=True)
    action = db.Column(db.String(64), primary_key=True)
    timestamp = db.Column(db.String(64), primary_key=True)
    data = db.Column(db.JSON, nullable=False)

    def __repr__(self):
        return f"Log('{self.doi}', '{self.userId}', '{self.action}', '{self.timestamp}', '{self.data}')"
    
    def to_dict(self):
        return {
            'doi': self.doi,
            'userId': self.userId,
            'action': self.action,
            'timestamp': self.timestamp,
            'data': self.data
        }
