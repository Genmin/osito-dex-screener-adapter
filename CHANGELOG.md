# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-06-30

### Added
- Initial release of Osito DEX Screener Adapter
- Full DEX Screener API v1.1 compliance
- Support for all required endpoints:
  - `/latest-block` - Latest block information
  - `/asset` - Asset information lookup
  - `/pair` - Pair information for Osito cores
  - `/events` - Swap events within block ranges
- Health check endpoint at `/health`
- Docker and Docker Compose support
- Automated deployment script
- Helper script to fetch Core contract addresses
- TypeScript implementation with Express.js
- Comprehensive error handling and logging
- LRU caching for performance optimization
- Environment-based configuration
- Stateless, on-demand data fetching

### Features
- ✅ Tracks Osito protocol swap events on Berachain
- ✅ Alphabetical asset ordering for deterministic pairs
- ✅ String serialization for high-precision numbers
- ✅ Proper reserve tracking after swap events
- ✅ Support for multiple Core contracts
- ✅ Asset decimals detection and handling
- ✅ Transaction and event indexing
- ✅ Block-based event sorting

### Documentation
- Complete setup and deployment guide
- Docker deployment instructions
- API endpoint documentation
- Configuration examples
- Core contract discovery utilities

[1.0.0]: https://github.com/Genmin/osito-dex-screener-adapter/releases/tag/v1.0.0 