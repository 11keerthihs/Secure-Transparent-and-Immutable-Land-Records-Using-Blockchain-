// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LandRegistry
 * @dev Immutable Land Record Management smart contract for registering,
 * updating, verifying, and transferring land records on an Ethereum-compatible network.
 */
contract LandRegistry {
    // Government / Contract Deployer
    address public owner;
    uint256 public nextId;

    // Land structure containing official registration records
    struct Land {
        uint256 id;
        string parcelId;
        string surveyNumber;
        string plotNumber;
        string state;
        string district;
        string taluka;
        string village;
        string addressLine;
        string landUse;
        uint256 area;
        string areaUnit;
        string coordinates;
        string ownerName;
        string ownerGovId;      // Stored as SHA-256 hash or normalized identifier
        string documentHash;    // SHA-256 cryptographic digest of deed / deed papers
        uint256 marketValue;
        uint256 registrationDate;
        string status;          // "VERIFIED", "PENDING_TRANSFER", "TRANSFERRED"
        bool exists;
    }

    // Mapping from land ID to Land record
    mapping(uint256 => Land) private lands;
    // Array of land IDs for enumeration
    uint256[] private landIds;

    // Events
    event LandRegistered(
        uint256 indexed id,
        string parcelId,
        string ownerName,
        string documentHash,
        uint256 timestamp
    );

    event LandUpdated(
        uint256 indexed id,
        string parcelId,
        string ownerName,
        uint256 marketValue,
        string status,
        uint256 timestamp
    );

    event LandOwnershipTransferred(
        uint256 indexed id,
        string previousOwnerGovId,
        string newOwnerName,
        string newOwnerGovId,
        uint256 newMarketValue,
        uint256 timestamp
    );

    event LandDeleted(
        uint256 indexed id,
        string parcelId,
        uint256 timestamp
    );

    // Modifier to restrict write operations to Government / Authority deployer
    modifier onlyOwner() {
        require(msg.sender == owner, "Only authorized government authority can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
        nextId = 1;
    }

    /**
     * @notice Registers a new land record on the blockchain
     */
    function addLand(
        string memory _parcelId,
        string memory _surveyNumber,
        string memory _plotNumber,
        string memory _state,
        string memory _district,
        string memory _taluka,
        string memory _village,
        string memory _addressLine,
        string memory _landUse,
        uint256 _area,
        string memory _areaUnit,
        string memory _coordinates,
        string memory _ownerName,
        string memory _ownerGovId,
        string memory _documentHash,
        uint256 _marketValue,
        uint256 _registrationDate,
        string memory _status
    ) external onlyOwner returns (uint256) {
        require(bytes(_parcelId).length > 0, "Parcel ID cannot be empty");
        require(bytes(_documentHash).length > 0, "Document hash cannot be empty");
        require(bytes(_ownerName).length > 0, "Owner name cannot be empty");

        uint256 currentId = nextId;
        nextId++;

        lands[currentId] = Land({
            id: currentId,
            parcelId: _parcelId,
            surveyNumber: _surveyNumber,
            plotNumber: _plotNumber,
            state: _state,
            district: _district,
            taluka: _taluka,
            village: _village,
            addressLine: _addressLine,
            landUse: _landUse,
            area: _area,
            areaUnit: _areaUnit,
            coordinates: _coordinates,
            ownerName: _ownerName,
            ownerGovId: _ownerGovId,
            documentHash: _documentHash,
            marketValue: _marketValue,
            registrationDate: _registrationDate > 0 ? _registrationDate : block.timestamp,
            status: bytes(_status).length > 0 ? _status : "VERIFIED",
            exists: true
        });

        landIds.push(currentId);

        emit LandRegistered(currentId, _parcelId, _ownerName, _documentHash, block.timestamp);
        return currentId;
    }

    /**
     * @notice Updates existing land metadata
     */
    function updateLand(
        uint256 _id,
        string memory _landUse,
        uint256 _marketValue,
        string memory _status,
        string memory _documentHash
    ) external onlyOwner {
        require(lands[_id].exists, "Land record does not exist");

        Land storage land = lands[_id];
        land.landUse = _landUse;
        land.marketValue = _marketValue;
        land.status = _status;
        if (bytes(_documentHash).length > 0) {
            land.documentHash = _documentHash;
        }

        emit LandUpdated(_id, land.parcelId, land.ownerName, _marketValue, _status, block.timestamp);
    }

    /**
     * @notice Transfers ownership record after government verification
     */
    function transferOwnershipRecord(
        uint256 _id,
        string memory _newOwnerName,
        string memory _newOwnerGovId,
        uint256 _newMarketValue,
        string memory _newDocumentHash
    ) external onlyOwner {
        require(lands[_id].exists, "Land record does not exist");
        require(bytes(_newOwnerName).length > 0, "New owner name required");
        require(bytes(_newOwnerGovId).length > 0, "New owner Gov ID required");

        Land storage land = lands[_id];
        string memory previousGovId = land.ownerGovId;

        land.ownerName = _newOwnerName;
        land.ownerGovId = _newOwnerGovId;
        if (_newMarketValue > 0) {
            land.marketValue = _newMarketValue;
        }
        if (bytes(_newDocumentHash).length > 0) {
            land.documentHash = _newDocumentHash;
        }
        land.status = "VERIFIED";

        emit LandOwnershipTransferred(
            _id,
            previousGovId,
            _newOwnerName,
            _newOwnerGovId,
            _newMarketValue,
            block.timestamp
        );
    }

    /**
     * @notice Marks a land record as deleted
     */
    function deleteLand(uint256 _id) external onlyOwner {
        require(lands[_id].exists, "Land record does not exist");
        string memory parcel = lands[_id].parcelId;
        lands[_id].exists = false;
        emit LandDeleted(_id, parcel, block.timestamp);
    }

    /**
     * @notice Retrieves a single land record by ID
     */
    function getLand(uint256 _id) external view returns (Land memory) {
        require(lands[_id].exists, "Land record does not exist");
        return lands[_id];
    }

    /**
     * @notice Returns all active land records
     */
    function getAllLands() external view returns (Land[] memory) {
        uint256 total = 0;
        for (uint256 i = 0; i < landIds.length; i++) {
            if (lands[landIds[i]].exists) {
                total++;
            }
        }

        Land[] memory activeLands = new Land[](total);
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < landIds.length; i++) {
            if (lands[landIds[i]].exists) {
                activeLands[currentIndex] = lands[landIds[i]];
                currentIndex++;
            }
        }
        return activeLands;
    }

    /**
     * @notice Total number of registered lands created
     */
    function getTotalCount() external view returns (uint256) {
        return landIds.length;
    }
}
