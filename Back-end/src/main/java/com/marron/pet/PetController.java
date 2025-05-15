package com.marron.pet;

import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.View;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:5173") // Allow requests from React's development server
@Controller // This means that this class is a Controller
@RequestMapping(path="/marron/pets") // This means URL's start with /marron/pets
public class PetController {
    @Autowired
    private PetRepository petRepository;

    @Autowired
    private View error;

    @GetMapping()
    public ResponseEntity<Iterable<Pet>> getAllPets() {
        Iterable<Pet> pets = petRepository.findAll(); // Return all pets
        return ResponseEntity.ok(pets);
    }

    @PostMapping()
    public ResponseEntity<Pet> createPet(@RequestBody Pet pet) {
        Pet savedPet = petRepository.save(pet);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedPet); // Returns the saved Pet object with 201 Created
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPetById(@PathVariable Integer id) {
        Optional<Pet> pet = petRepository.findById(id);
        return pet.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePet(@PathVariable Integer id, @RequestBody Pet pet) {
        return petRepository.findById(id)
                .map(currentPet -> {
                    currentPet.setName(pet.getName());
                    currentPet.setSpecies(pet.getSpecies());
                    currentPet.setBreed(pet.getBreed());
                    currentPet.setGender(pet.getGender());
                    currentPet.setImage(pet.getImage());
                    currentPet.setDescription(pet.getDescription());
                    currentPet.setPrice(pet.getPrice());
                    Pet updatedPet = petRepository.save(currentPet);
                    return ResponseEntity.ok(updatedPet); // Return the updated Pet object
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePet(@PathVariable Integer id) {
        if (petRepository.existsById(id)) {
            petRepository.deleteById(id);
            return ResponseEntity.noContent().build(); // Returns 204 No Content on successful deletion
        } else {
            return ResponseEntity.notFound().build(); // Returns 404 Not Found if pet doesn't exist
        }
    }

    @GetMapping("/search") // REPLACED THE OLD @GetMapping("/search/{key}")
    public ResponseEntity<?> searchPet(
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "species", required = false) String species,
            @RequestParam(value = "breed", required = false) String breed,
            @RequestParam(value = "gender", required = false) String gender,
            @RequestParam(value = "image", required = false) String image,
            @RequestParam(value = "description", required = false) String description) {

        List<Pet> pets = petRepository.findByNameOrSpeciesOrBreedOrGenderOrImageOrDescription(
                name, species, breed, gender, image, description);

        if (pets.isEmpty()) {
            return ResponseEntity.ok(Collections.singletonMap("message", "No pet found matching your criteria."));
        }

        return ResponseEntity.ok(pets);
    }

    @GetMapping("/search/price/{price}")
    public ResponseEntity<?> getPetsByPrice(@PathVariable Double price) {
        List<Pet> pets = petRepository.findByPriceLessThanEqual(price);

        if (!pets.isEmpty()) {
            return ResponseEntity.ok(pets);
        } else {
            return ResponseEntity.ok(Collections.singletonMap("message", "No pets found for the price of: " + price));
        }
    }

    @PostMapping("/bulk") // New endpoint for bulk creation
    public ResponseEntity<List<Pet>> createPets(@RequestBody List<Pet> pets) {
        List<Pet> savedPets = petRepository.saveAll(pets);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedPets);
    }

}