from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class TrendItem(Base):
    __tablename__ = "trend_items"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String(50), nullable=False, index=True)
    category = Column(String(100), nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    url = Column(String(1000), nullable=True)
    score = Column(Float, nullable=True)
    rank = Column(Integer, nullable=True)
    tags = Column(Text, nullable=True)
    thumbnail = Column(String(1000), nullable=True)
    author = Column(String(200), nullable=True)
    view_count = Column(Integer, nullable=True)
    like_count = Column(Integer, nullable=True)
    comment_count = Column(Integer, nullable=True)
    collected_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class CollectionLog(Base):
    __tablename__ = "collection_logs"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)
    items_collected = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
